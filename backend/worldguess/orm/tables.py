from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import Float, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase): ...


class Countries(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    geometry: Mapped[WKBElement] = mapped_column(Geometry(geometry_type="POLYGON"))


class PopulationCell(Base):
    __tablename__ = "population_cells"

    id: Mapped[int] = mapped_column(primary_key=True)
    population_density: Mapped[float] = mapped_column(Float)
    area_sqkm: Mapped[float] = mapped_column(Float)
    geometry: Mapped[WKBElement] = mapped_column(Geometry(geometry_type="POLYGON", srid=4326))
